// api/check-webhooks.js
const CALENDLY_API_TOKEN = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzU1OTQxMjk1LCJqdGkiOiI4ZjU3NmE3NC04NWYwLTRjNTYtOWUxYy01MDFmMGYwYTg5ZTIiLCJ1c2VyX3V1aWQiOiJkZjEwMDNlYS1iNDk5LTQ5MzQtOTFmYi01YWI5OTY1OTZlYmQifQ.ak3k8KXAbsBpU9Gtyp4vEmgt7vZQGVvSMW2yaS7ekK2kszBJxkMalaIo0Cxnpv9FnxPSD82X0cadbqtV9LdiyA';

async function checkWebhooks() {
  console.log('🔍 Checking all webhooks...\n');
  
  // Get user info
  const userResponse = await fetch('https://api.calendly.com/users/me', {
    headers: {
      'Authorization': `Bearer ${CALENDLY_API_TOKEN}`
    }
  });
  
  const userData = await userResponse.json();
  const orgUri = userData.resource.current_organization;
  
  // List ALL webhooks - zonder user filter
  const response = await fetch(`https://api.calendly.com/webhook_subscriptions?organization=${orgUri}`, {
    headers: {
      'Authorization': `Bearer ${CALENDLY_API_TOKEN}`
    }
  });
  
  const data = await response.json();
  const webhooks = data.collection || [];
  
  if (webhooks.length === 0) {
    console.log('❌ NO WEBHOOKS FOUND!');
    console.log('The webhook might not have been created properly.');
    return;
  }
  
  console.log(`Found ${webhooks.length} webhook(s):\n`);
  
  webhooks.forEach((webhook, index) => {
    console.log(`Webhook ${index + 1}:`);
    console.log('  ID:', webhook.uri.split('/').pop());
    console.log('  URL:', webhook.callback_url);
    console.log('  State:', webhook.state);
    console.log('  Events:', webhook.events.join(', '));
    console.log('  Scope:', webhook.scope);
    console.log('  Created:', new Date(webhook.created_at).toLocaleString('nl-NL'));
    console.log('  Creator:', webhook.creator);
    console.log('---');
  });
  
  // Check voor webhook.site webhook
  const webhookSite = webhooks.find(w => w.callback_url.includes('webhook.site'));
  if (webhookSite) {
    console.log('✅ Webhook.site webhook found and is:', webhookSite.state);
    
    if (webhookSite.state !== 'active') {
      console.log('⚠️ WARNING: Webhook is not active!');
    }
  } else {
    console.log('❌ No webhook.site webhook found!');
  }
}

checkWebhooks();
