-- Create system_settings table for admin configurations
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and modify settings
CREATE POLICY "Admins can view all settings"
  ON public.system_settings
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
  ON public.system_settings
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings"
  ON public.system_settings
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value) VALUES
  ('email_notifications', '{"enabled": true, "notify_on_new": true, "notify_on_update": true}'::jsonb),
  ('auto_assignment', '{"enabled": false, "strategy": "round_robin"}'::jsonb),
  ('default_priority', '{"value": "Medium"}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;