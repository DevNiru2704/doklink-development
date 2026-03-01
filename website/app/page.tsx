"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  Shield,
  Users,
  FileText,
  ChevronRight,
  Stethoscope,
  Activity,
  UserPlus,
  LogIn,
  Sparkles,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "SuperAdmin") {
        router.push("/superadmin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);

  // Show loading during session check
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <div className="text-xl text-white">Loading...</div>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/5 animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-64 h-64 rounded-full bg-white/3 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-20 right-1/4 w-96 h-96 rounded-full bg-white/5 animate-pulse delay-500"></div>
      </div>
      
      {/* Header */}
      <header className="relative bg-black/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <Heart className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 h-8 w-8 bg-white/20 rounded-full blur-lg group-hover:bg-white/30 transition-all duration-300"></div>
              </div>
              <span className="text-2xl font-bold text-white">DokLink Hospital</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white border border-white/20 hover:bg-white hover:text-black transition-all duration-300 group">
                  <LogIn className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span>Login</span>
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-white text-black hover:bg-gray-100 transition-all duration-300 group transform hover:scale-105">
                  <UserPlus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span>Sign Up</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Next Generation Healthcare</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white mb-8 animate-slide-up">
              Modern Hospital
              <span className="block bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Management System
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up delay-200">
              Streamline your healthcare operations with our comprehensive platform. 
              Manage patients, beds, claims, and staff efficiently in one integrated solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up delay-400">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-10 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300 group">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black px-10 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-black mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools for modern healthcare management
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center bg-black text-white border-0 transform hover:scale-105 transition-all duration-300 group">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                  <Users className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-white text-xl mb-4">Patient Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  Comprehensive patient records, admission tracking, and care coordination
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white border-2 border-black transform hover:scale-105 transition-all duration-300 group">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-black text-xl mb-4">Bed Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Real-time bed availability, ward management, and resource optimization
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-black text-white border-0 transform hover:scale-105 transition-all duration-300 group">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                  <FileText className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-white text-xl mb-4">Claims Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  Streamlined insurance claims, billing management, and financial tracking
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white border-2 border-black transform hover:scale-105 transition-all duration-300 group">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-black text-xl mb-4">Secure & Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  HIPAA compliant security, role-based access, and data protection
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-6xl font-black text-white mb-8">
            Ready to Transform
            <span className="block">Your Hospital?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of healthcare professionals using DokLink to improve patient care and operational efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-12 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300 group">
                Start Free Trial
                <Zap className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black px-12 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0 group">
              <Heart className="h-8 w-8 text-black group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-black">DokLink Hospital</span>
            </div>
            <p className="text-gray-600 text-lg">
              © 2026 DokLink Hospital Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
