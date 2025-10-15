-- Add video_bot type support and flow builder fields to chatbot_messages
-- This allows storing node positions and connections for the visual flow builder

-- Add node_position and node_connections fields to chatbot_messages for flow builder
ALTER TABLE chatbot_messages 
ADD COLUMN IF NOT EXISTS node_position jsonb DEFAULT '{"x": 0, "y": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS node_connections jsonb DEFAULT '[]'::jsonb;

-- Add comment to clarify usage
COMMENT ON COLUMN chatbot_messages.node_position IS 'Canvas position for visual flow builder (x, y coordinates)';
COMMENT ON COLUMN chatbot_messages.node_connections IS 'Array of connection objects defining edges to other nodes';