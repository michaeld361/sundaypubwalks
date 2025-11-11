const INSTAGRAM_ACCOUNT_ID = '17841478571170680'; // your IG business ID
const INSTAGRAM_ACCESS_TOKEN = 'EAAdf3eZANtMQBPwzm5PO5cw1cw0RBZBVVYGvLTF68OT76ZCtpQ5yphIHpBNBFVVWvlOV2ZAMPg61xsOmiLWeX73QSqK0MKj2OYpCuxnLCssW3s2opVUNnN7jDkEEgAOWuB6wN7EGMM34Wz2PzaOLD9KspXlAzxtst8vVqEtZBKZBDHRyMIVjY6Nl2sWrOOqKVTXMFVvphxHomnrcPT5ujhnODfTXDHFWEkNRZCET3gC26yhpA81kXRah4BQGhPJJNkgmefkb8X0WQ0aH12Usw268fcQNgZDZD'; // from Graph API Explorer

async function testInstagram() {
  const fields = [
    'id',
    'username',
    'media_count',
    'biography',
    'name',
    'profile_picture_url'
  ].join(',');

  const url =
    `https://graph.facebook.com/v21.0/${INSTAGRAM_ACCOUNT_ID}` +
    `?fields=${fields}` +
    `&access_token=${encodeURIComponent(INSTAGRAM_ACCESS_TOKEN)}`;

  const res = await fetch(url);
  const data = await res.json();
  console.log(data);
}

testInstagram().catch(console.error);