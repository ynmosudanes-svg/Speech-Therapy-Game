require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpload() {
  console.log('Testing upload to bucket "uploads"...');
  
  const fileContent = 'Hello World';
  const fileName = `test-${Date.now()}.txt`;
  
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, fileContent, {
      contentType: 'text/plain',
      upsert: false
    });
    
  if (error) {
    console.error('Upload failed:', error.message);
  } else {
    console.log('Upload successful:', data);
  }
}

testUpload();
