import { redirect } from 'react-router-dom';

export async function profileLoader() {
  if (!localStorage.getItem('token')) {
    return redirect('/auth/login');
  }
  return null; // component handles the fetch
}