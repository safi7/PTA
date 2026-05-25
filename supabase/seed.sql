-- Seed: Create initial super_admin user
-- Password: Admin@1234 (change immediately after first login)
-- Hash generated with bcrypt cost 12

INSERT INTO users (username, email, full_name, password_hash, role)
VALUES (
  'admin',
  'admin@paktintravel.com',
  'System Administrator',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCXuYc5sOCzKRbAWj4GkDry', -- Admin@1234
  'super_admin'
)
ON CONFLICT (username) DO NOTHING;

-- Note: Generate a new hash with:
-- node -e "const b=require('bcryptjs'); b.hash('YourPassword',12).then(console.log)"
