-- Performance fixes from the Supabase advisors (2026-09-26 review).
-- Not applied automatically: run in the SQL editor or `supabase db push`.
-- Access rules are unchanged; only how they are evaluated.

-- 1. Evaluate auth.uid() once per query instead of once per row.
alter policy billing_entitlements_select_own on public.billing_entitlements using (((select auth.uid()) = user_id));
alter policy billing_orders_select_own on public.billing_orders using (((select auth.uid()) = user_id));
alter policy billing_subscriptions_select_own on public.billing_subscriptions using (((select auth.uid()) = user_id));
alter policy "Users can delete own budgets" on public.budgets using ((user_id = (select auth.uid())));
alter policy "Users can insert own budgets" on public.budgets with check ((user_id = (select auth.uid())));
alter policy "Users can update own budgets" on public.budgets using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "Users can view own budgets" on public.budgets using ((user_id = (select auth.uid())));
alter policy "Users can delete own categories" on public.categories using ((user_id = (select auth.uid())));
alter policy "Users can insert own categories" on public.categories with check ((user_id = (select auth.uid())));
alter policy "Users can update own categories" on public.categories using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "Users can view own categories" on public.categories using ((user_id = (select auth.uid())));
alter policy "Users can delete own debts" on public.debts using ((user_id = (select auth.uid())));
alter policy "Users can insert own debts" on public.debts with check ((user_id = (select auth.uid())));
alter policy "Users can update own debts" on public.debts using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "Users can view own debts" on public.debts using ((user_id = (select auth.uid())));
alter policy "Users can delete own goals" on public.goals using ((user_id = (select auth.uid())));
alter policy "Users can insert own goals" on public.goals with check ((user_id = (select auth.uid())));
alter policy "Users can update own goals" on public.goals using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "Users can view own goals" on public.goals using ((user_id = (select auth.uid())));
alter policy "Users can update own profile" on public.profiles using ((id = (select auth.uid()))) with check ((id = (select auth.uid())));
alter policy "Users can view own profile" on public.profiles using ((id = (select auth.uid())));
alter policy "Users can delete own subscriptions" on public.subscriptions using ((user_id = (select auth.uid())));
alter policy "Users can insert own subscriptions" on public.subscriptions with check ((user_id = (select auth.uid())));
alter policy "Users can update own subscriptions" on public.subscriptions using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "Users can view own subscriptions" on public.subscriptions using ((user_id = (select auth.uid())));
alter policy "Users can delete own transactions" on public.transactions using ((user_id = (select auth.uid())));
alter policy "Users can insert own transactions" on public.transactions with check ((user_id = (select auth.uid())));
alter policy "Users can update own transactions" on public.transactions using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "Users can view own transactions" on public.transactions using ((user_id = (select auth.uid())));

-- 2. Cover foreign keys used in joins and cascades.
create index if not exists billing_subscriptions_order_id_idx on public.billing_subscriptions (order_id);
create index if not exists billing_subscriptions_user_id_idx on public.billing_subscriptions (user_id);
create index if not exists budgets_category_id_idx on public.budgets (category_id);
create index if not exists transactions_category_id_idx on public.transactions (category_id);

