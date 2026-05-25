const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.get('/scan-history', async (req, res) => {
  const { data, error } = await supabase
    .from('scan_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.json({ success: false, error });
  }

  res.json({ success: true, data });
});

module.exports = router;