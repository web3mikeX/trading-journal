## Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.

## Common Development Issues & Solutions

### WSL2 + Next.js Development Server Issues
**Problem**: "This site can't be reached" or "Connection refused" when accessing localhost:3000 from Windows browser
**Diagnosis**: 
- `curl -I http://localhost:3000` fails with "Connection refused"
- Server starts successfully but isn't accessible from Windows

**Solution**:
```bash
# Start server with explicit host binding
npx next dev -H 0.0.0.0
# or
npm run dev -- --hostname 0.0.0.0
```

**Alternative access**: Use WSL IP address instead of localhost
```bash
# Get WSL IP
hostname -I
# Then access via http://[WSL_IP]:3000 (e.g., http://172.24.41.211:3000)
```

### JavaScript Hoisting/Initialization Errors
**Problem**: "Cannot access '[function]' before initialization" runtime error
**Root cause**: `const` and `let` function declarations are not hoisted like `function` declarations
**Example error**: `Cannot access 'formatAccountType' before initialization`

**Solution**: Move function declarations above their usage in the component
```javascript
// ❌ Wrong - usage before declaration
const result = formatAccountType(type)
const formatAccountType = (type) => { ... }

// ✅ Correct - declaration before usage  
const formatAccountType = (type) => { ... }
const result = formatAccountType(type)
```

**Quick diagnosis checklist**:
1. **Runtime errors about "before initialization"** → Check function declaration order
2. **"Connection refused" on localhost:3000 in WSL2** → Use `npx next dev -H 0.0.0.0` and try WSL IP address  
3. **Server appears to start but connection fails** → WSL2 networking issue, not a code issue