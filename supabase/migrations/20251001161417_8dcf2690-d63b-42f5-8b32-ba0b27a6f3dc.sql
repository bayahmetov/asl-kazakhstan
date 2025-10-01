-- Update a user to have admin role so they can access the admin dashboard
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'a.sartaev2008@gmail.com';