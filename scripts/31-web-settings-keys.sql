-- Extended website settings keys (run in Supabase SQL Editor)
INSERT INTO site_settings (key, value) VALUES
  ('company_legal_name', 'Energy and Logics Ltd'),
  ('company_brand_name', 'Energy & Logics'),
  ('company_platform_name', 'Engineering Hub'),
  ('company_phone_display', '+250 783 986 252'),
  ('company_whatsapp', '250783986252'),
  ('company_slogan', 'Engineering sustainable solutions'),
  ('company_tagline', 'Hands-on engineering training and technical support in Rwanda.'),
  ('payment_method_label', 'MTN Mobile Money (MoMo Pay)'),
  ('payment_workflow', 'Pay via MTN MoMo using the Pay Code below, then upload your payment receipt so our team can verify and confirm your enrollment.'),
  ('seo_title', 'Energy & Logics — Engineering Training Rwanda'),
  ('seo_description', 'Hands-on engineering training and technical support in Rwanda.'),
  ('seo_keywords', 'Energy and Logics, engineering training Rwanda, embedded systems, PLC, Kigali, East Africa')
ON CONFLICT (key) DO NOTHING;
