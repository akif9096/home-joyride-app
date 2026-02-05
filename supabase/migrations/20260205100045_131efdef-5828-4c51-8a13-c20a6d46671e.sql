-- Create table to store OTPs
CREATE TABLE public.email_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified BOOLEAN DEFAULT false
);

-- Create index for faster lookups
CREATE INDEX idx_email_otps_email ON public.email_otps(email);
CREATE INDEX idx_email_otps_expires ON public.email_otps(expires_at);

-- Enable RLS
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for signup flow)
CREATE POLICY "Allow anonymous insert" ON public.email_otps
FOR INSERT WITH CHECK (true);

-- Policy: Allow anonymous select for verification
CREATE POLICY "Allow anonymous select" ON public.email_otps
FOR SELECT USING (true);

-- Policy: Allow anonymous update for marking verified
CREATE POLICY "Allow anonymous update" ON public.email_otps
FOR UPDATE USING (true);

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.email_otps WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;