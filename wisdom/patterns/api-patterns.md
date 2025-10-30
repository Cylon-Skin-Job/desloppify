# API Patterns

**Category:** Patterns  
**Last updated:** 2025-10-29

---

## API Client with Auth

```javascript
// api-client.js
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add auth token if available
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });
  
  // Check for errors before parsing
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// Convenience methods
export const api = {
  get: (endpoint) => apiCall(endpoint, { method: 'GET' }),
  post: (endpoint, data) => apiCall(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => apiCall(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => apiCall(endpoint, { method: 'DELETE' })
};
```

**Usage:**
```javascript
import { api, setAuthToken } from './api-client.js';

// Set token once after login
setAuthToken(userToken);

// Make API calls
const messages = await api.get('/messages');
const newMessage = await api.post('/messages', { text: 'Hello' });
```

**Why this pattern:**
- DRY (auth token in one place)
- Error handling centralized
- Easy to add logging/retry logic
- Clean API

**Source:** RavenOS

---

## Express Middleware Pattern

```javascript
// middleware/verifyAuth.js
export async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach user to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
    
    next();
  } catch (error) {
    console.error('Auth verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Usage:**
```javascript
import { verifyAuth } from './middleware/verifyAuth.js';

// Apply to protected routes
app.post('/api/messages', verifyAuth, async (req, res) => {
  // req.user is available here
  const userId = req.user.uid;
  // ... route logic
});
```

**Source:** RavenOS

---

## Streaming API with Multiple Chain-Of-Thought Formats

```javascript
// Handle streaming response with reasoning/thinking tokens
async function streamFromAPI(payload, bubbleElement) {
  const response = await fetch('https://api.example.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...payload,
      stream: true,
      reasoning: { enabled: true, effort: "high" }
    })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  let fullMessage = '';
  let reasoningText = '';
  let reasoningDiv = null;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          
          // PARADIGM 1: DeepSeek format (string in delta.reasoning)
          if (delta?.reasoning && typeof delta.reasoning === 'string') {
            reasoningText += delta.reasoning;
            
            if (!reasoningDiv) {
              reasoningDiv = document.createElement('div');
              reasoningDiv.className = 'bubble-reasoning';
              reasoningDiv.innerHTML = '<div class="reasoning-label">🤔 Thinking:</div><div class="reasoning-content"></div>';
              bubbleElement.appendChild(reasoningDiv);
            }
            
            const contentDiv = reasoningDiv.querySelector('.reasoning-content');
            contentDiv.innerHTML = marked.parse(reasoningText);
          }
          
          // PARADIGM 2: Inclusion AI format (array in delta.reasoning_details)
          // Used by Qwen and other models
          if (delta?.reasoning_details && delta.reasoning_details.length > 0) {
            for (const reasoning of delta.reasoning_details) {
              if (reasoning.type === 'reasoning.text' && reasoning.text) {
                reasoningText += reasoning.text;
                
                if (!reasoningDiv) {
                  reasoningDiv = document.createElement('div');
                  reasoningDiv.className = 'bubble-reasoning';
                  reasoningDiv.innerHTML = '<div class="reasoning-label">🤔 Thinking:</div><div class="reasoning-content"></div>';
                  bubbleElement.appendChild(reasoningDiv);
                }
                
                const contentDiv = reasoningDiv.querySelector('.reasoning-content');
                contentDiv.innerHTML = marked.parse(reasoningText);
              }
            }
          }
          
          // Handle regular content
          const content = delta?.content;
          if (content) {
            fullMessage += content;
            const contentDiv = bubbleElement.querySelector('.bubble-content');
            if (contentDiv) {
              contentDiv.innerHTML = marked.parse(fullMessage);
            }
          }
          
        } catch (e) {
          console.debug('Skipping chunk:', e);
        }
      }
    }
  }
  
  return { fullMessage, reasoning: reasoningText };
}
```

**Usage:**
```javascript
const assistantBubble = createChatBubble('', 'assistant');
const result = await streamFromAPI(payload, assistantBubble);
saveChatMessage(userMessage, result.fullMessage, result.reasoning);
```

**Why this pattern:**
- Handles TWO different Chain-Of-Thought formats
- DeepSeek sends reasoning as simple string in `delta.reasoning`
- Qwen (and others) send reasoning as array in `delta.reasoning_details[]`
- Both formats are supported simultaneously
- Reasoning displays in real-time as it streams

**Gotchas:**
- Must check for BOTH formats (models use different APIs)
- `reasoning_details` is an array - loop through it
- Each item has `type` (e.g. `'reasoning.text'`) and `text` field
- Reasoning tokens come BEFORE content tokens
- Use `marked.parse()` for markdown rendering

**CSS needed:**
```css
.bubble-reasoning {
  background: #f0f0f0;
  border-left: 3px solid #007bff;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.reasoning-label {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #007bff;
}

.reasoning-content {
  font-size: 0.9em;
  color: #666;
}
```

**Source:** Fusion Studio

