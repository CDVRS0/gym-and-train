export async function passwordSignIn(client, email, password) {
  if (!email.trim() || !password) throw new Error('Enter your email and password.');
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function setAccountPassword(client, password, confirmation) {
  if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
  if (password !== confirmation) throw new Error('Passwords do not match.');
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) throw new Error('Sign in with your email link before setting a password.');
  const { error } = await client.auth.updateUser({ password });
  if (error) throw error;
}

export async function sendAccountLink(client, email, origin) {
  const { error } = await client.auth.signInWithOtp({
    email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: origin },
  });
  if (error) throw error;
}
