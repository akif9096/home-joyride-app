-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer', 'worker');

-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'searching', 'assigned', 'in_progress', 'completed', 'cancelled');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Create enum for payment method
CREATE TYPE public.payment_method AS ENUM ('cash', 'online');

-- Create enum for worker category
CREATE TYPE public.worker_category AS ENUM ('plumber', 'carpenter', 'painter', 'electrician', 'cleaner', 'ac_repair');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create workers table
CREATE TABLE public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  category worker_category NOT NULL,
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_online BOOLEAN DEFAULT FALSE,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  bio TEXT,
  skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create addresses table
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  full_address TEXT NOT NULL,
  city TEXT,
  pincode TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  service_icon TEXT,
  category worker_category NOT NULL,
  address_id UUID REFERENCES public.addresses(id),
  address_text TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  status order_status DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) DEFAULT 49,
  otp TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  transaction_reference TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_communications table for chat/messages
CREATE TABLE public.order_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create worker_notifications table for real-time alerts
CREATE TABLE public.worker_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Workers policies
CREATE POLICY "Anyone can view workers" ON public.workers FOR SELECT USING (true);
CREATE POLICY "Workers can update own profile" ON public.workers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Workers can insert own profile" ON public.workers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all workers" ON public.workers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Addresses policies
CREATE POLICY "Users can manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all addresses" ON public.addresses FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Orders policies
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Workers can view assigned orders" ON public.orders FOR SELECT USING (worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid()));
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Orders can be updated by involved parties" ON public.orders FOR UPDATE USING (
  auth.uid() = customer_id OR 
  worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Workers can view their transactions" ON public.transactions FOR SELECT USING (worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid()));
CREATE POLICY "Transactions can be created by customers" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Transactions can be updated" ON public.transactions FOR UPDATE USING (auth.uid() = customer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Communications policies
CREATE POLICY "Order parties can view messages" ON public.order_communications FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid() OR worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid()))
);
CREATE POLICY "Order parties can send messages" ON public.order_communications FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admins can view all communications" ON public.order_communications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Worker notifications policies
CREATE POLICY "Workers can view own notifications" ON public.worker_notifications FOR SELECT USING (worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid()));
CREATE POLICY "Notifications can be created for orders" ON public.worker_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Workers can acknowledge notifications" ON public.worker_notifications FOR UPDATE USING (worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage notifications" ON public.worker_notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  -- Default role is customer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON public.workers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications and orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_communications;