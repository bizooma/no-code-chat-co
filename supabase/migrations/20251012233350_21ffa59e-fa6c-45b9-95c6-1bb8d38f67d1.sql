-- Allow public viewing of active avatar chatbots
CREATE POLICY "Anyone can view active avatar chatbots"
ON avatar_chatbots
FOR SELECT
USING (is_active = true);