# Emergency Booking Management Commands

## expire_reservations

This command automatically expires old emergency bed reservations and releases beds back to the hospital inventory.

### Usage

Run manually:
```bash
python manage.py expire_reservations
```

### Automation

For production, set up a cron job to run this command every 5-10 minutes:

```bash
# Edit crontab
crontab -e

# Add this line to run every 5 minutes
*/5 * * * * cd /path/to/doklink/server/doklink && /path/to/python manage.py expire_reservations >> /var/log/doklink/expire_reservations.log 2>&1
```

Or use Django-Q, Celery, or similar task scheduler:

```python
# Example with Celery Beat
from celery import shared_task

@shared_task
def expire_old_reservations():
    call_command('expire_reservations')

# In celery.py
app.conf.beat_schedule = {
    'expire-reservations-every-5-minutes': {
        'task': 'healthcare.tasks.expire_old_reservations',
        'schedule': 300.0,  # 5 minutes
    },
}
```

### What It Does

1. Finds all reservations with status `reserved` or `patient_on_way` that have passed their `reservation_expires_at` time
2. Updates their status to `expired`
3. Releases the bed back to hospital inventory (increments available bed count)
4. Logs each expired booking

### Example Output

```
Expired booking #123 for City General Hospital (general bed released)
Expired booking #124 for AIIMS Durgapur (icu bed released)
Successfully expired 2 booking(s) and released beds
```
