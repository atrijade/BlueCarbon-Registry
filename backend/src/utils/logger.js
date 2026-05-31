/**
 * Utility to log database errors with detailed fields (code, message, details, hint)
 * to make troubleshooting Supabase/PostgreSQL schema errors much easier.
 */
function logDbError(context, error) {
  if (!error) return;
  console.error(`\n❌ [Database Error] Context: ${context}`);
  console.error(`   Message: ${error.message || error}`);
  if (error.code) console.error(`   Code:    ${error.code}`);
  if (error.details) console.error(`   Details: ${error.details}`);
  if (error.hint) console.error(`   Hint:    ${error.hint}`);
  console.error(''); // newline for spacing
}

module.exports = {
  logDbError
};
