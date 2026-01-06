export const getUserData = async (access_token) => {
  const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token${access_token}`);
  const data = await response.json();

  console.log('response',response);
  console.log('data',data);

  return data;
};