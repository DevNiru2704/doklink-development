# app_auth/otp_service.py
import random
import string
import requests
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import OTPVerification
import logging

logger = logging.getLogger(__name__)


class OTPService:
    """Centralized OTP generation and delivery service"""
    
    @staticmethod
    def generate_otp(length=6):
        """Generate a random OTP of specified length"""
        return ''.join(random.choices(string.digits, k=length))
    
    @staticmethod
    def create_otp_record(user, otp_type, delivery_method='auto', otp_length=6):
        """Create OTP record in database"""
        # Invalidate any existing OTPs of the same type for this user
        OTPVerification.objects.filter(
            user=user, 
            otp_type=otp_type, 
            is_used=False
        ).update(is_used=True)
        
        # Generate new OTP
        otp_code = OTPService.generate_otp(otp_length)
        
        # Create new OTP record
        otp_record = OTPVerification.objects.create(
            user=user,
            otp_type=otp_type,
            otp_code=otp_code,
            delivery_method=delivery_method,
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        return otp_record
    
    @staticmethod
    def send_email_otp(otp_record, subject_template="OTP Verification"):
        """Send OTP via email"""
        try:
            subject = f"{subject_template} - DokLink"
            message = f"""
Hi {otp_record.user.first_name},

Your verification code is: {otp_record.otp_code}

This code will expire in 10 minutes. Please do not share this code with anyone.

Best regards,
DokLink Team
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [otp_record.user.email],
                fail_silently=False,
            )
            
            # Update delivery status
            otp_record.delivery_status = 'sent'
            otp_record.delivery_destination = otp_record.user.email
            otp_record.save()
            
            logger.info(f"Email OTP sent successfully to {otp_record.user.email}")
            return True, f"OTP sent to {OTPService.mask_email(otp_record.user.email)}"
            
        except Exception as e:
            otp_record.delivery_status = 'failed'
            otp_record.save()
            logger.error(f"Failed to send email OTP: {e}")
            return False, "Failed to send OTP via email"
    
    @staticmethod
    def send_sms_otp(otp_record, phone_number):
        """Send OTP via SMS using Fast2SMS"""
        try:
            # Fast2SMS API configuration
            api_key = settings.FAST2SMS_API_KEY
            url = "https://www.fast2sms.com/dev/bulkV2"
            
            # Clean phone number (remove +91 if present)
            clean_phone = phone_number
            if phone_number.startswith('+91'):
                clean_phone = phone_number[3:]
            elif phone_number.startswith('91'):
                clean_phone = phone_number[2:]
            
            message = f"Your DokLink verification code is {otp_record.otp_code}. Valid for 10 minutes. Do not share with anyone."
            
            payload = {
                "authorization": api_key,
                "sender_id": "DOKLIK",  # Your sender ID from Fast2SMS
                "message": message,
                "language": "english",
                "route": "q",
                "numbers": clean_phone,
            }
            
            headers = {
                'authorization': api_key,
                'Content-Type': "application/x-www-form-urlencoded",
                'Cache-Control': "no-cache",
            }
            
            response = requests.post(url, data=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('return'):
                    # Update delivery status
                    otp_record.delivery_status = 'sent'
                    otp_record.delivery_destination = phone_number
                    otp_record.save()
                    
                    logger.info(f"SMS OTP sent successfully to {phone_number}")
                    return True, f"OTP sent to {OTPService.mask_phone(phone_number)}"
                else:
                    raise Exception(f"Fast2SMS API error: {result.get('message', 'Unknown error')}")
            else:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            otp_record.delivery_status = 'failed'
            otp_record.save()
            logger.error(f"Failed to send SMS OTP: {e}")
            return False, "Failed to send OTP via SMS"
    
    @staticmethod
    def send_otp(user, otp_type, delivery_method='auto', phone_number=None, email_subject="OTP Verification"):
        """Main method to send OTP based on delivery method"""
        try:
            # Create OTP record
            otp_record = OTPService.create_otp_record(user, otp_type, delivery_method)
            
            # Determine delivery method if auto
            if delivery_method == 'auto':
                if otp_type == 'phone' or (phone_number and delivery_method != 'email'):
                    delivery_method = 'sms'
                else:
                    delivery_method = 'email'
            
            # Send based on method
            if delivery_method == 'email':
                return OTPService.send_email_otp(otp_record, email_subject)
            elif delivery_method == 'sms':
                if not phone_number:
                    # Get phone from user profile
                    phone_number = str(user.profile.phone_number)
                return OTPService.send_sms_otp(otp_record, phone_number)
            else:
                raise ValueError(f"Invalid delivery method: {delivery_method}")
                
        except Exception as e:
            logger.error(f"Failed to send OTP: {e}")
            return False, "Failed to send OTP. Please try again."
    
    @staticmethod
    def verify_otp(user, otp_code, otp_type):
        """Verify OTP code"""
        try:
            # Find valid OTP
            otp_record = OTPVerification.objects.filter(
                user=user,
                otp_type=otp_type,
                otp_code=otp_code,
                is_used=False
            ).first()
            
            if not otp_record:
                return False, "Invalid OTP code"
            
            # Check if expired
            if otp_record.is_expired():
                return False, "OTP has expired. Please request a new one."
            
            # Check attempts
            otp_record.attempts += 1
            otp_record.save()
            
            if otp_record.attempts > otp_record.max_attempts:
                otp_record.is_used = True
                otp_record.save()
                return False, "Too many attempts. Please request a new OTP."
            
            # Mark as used
            otp_record.is_used = True
            otp_record.save()
            
            return True, "OTP verified successfully"
            
        except Exception as e:
            logger.error(f"OTP verification error: {e}")
            return False, "OTP verification failed"
    
    @staticmethod
    def mask_email(email):
        """Mask email for privacy"""
        if '@' not in email:
            return email
        
        local, domain = email.split('@', 1)
        if len(local) <= 3:
            masked_local = local[0] + '*' * (len(local) - 1)
        else:
            masked_local = local[:2] + '*' * (len(local) - 4) + local[-2:]
        
        return f"{masked_local}@{domain}"
    
    @staticmethod
    def mask_phone(phone):
        """Mask phone number for privacy"""
        phone_str = str(phone)
        if len(phone_str) <= 6:
            return '*' * len(phone_str)
        return phone_str[:3] + '*' * (len(phone_str) - 6) + phone_str[-3:]
