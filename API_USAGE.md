# Microservice API Integration Guide

## Authentication Flow
1. Login with credentials to get access & refresh tokens
2. Use access token for authenticated requests
3. Refresh tokens when access token expires

## Core Endpoints
```rest
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}

Response:
{
  "accessToken": "JWT_TOKEN",
  "refreshToken": "REFRESH_TOKEN"
}
```

## Framework Integration

### React
```jsx
import axios from 'axios';

const login = async (email, password) => {
  const response = await axios.post('/auth/login', { email, password });
  localStorage.setItem('accessToken', response.data.accessToken);
  localStorage.setItem('refreshToken', response.data.refreshToken);
};

// Authenticated request
axios.get('/users/me', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
  }
});
```

### Angular
```typescript
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<{accessToken: string}>('/auth/login', { email, password });
  }

  getProfile() {
    return this.http.get('/users/me', {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }
}
```

### Vanilla JS
```javascript
// Login
fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'your_password'
  })
})
.then(response => response.json())
.then(data => {
  document.cookie = `accessToken=${data.accessToken}; path=/`;
});

// Authenticated request
fetch('/users/me', {
  headers: {
    'Authorization': `Bearer ${getCookie('accessToken')}`
  }
});
```

## Error Handling
- 401 Unauthorized: Refresh token or re-authenticate
- 403 Forbidden: Check user permissions
- 429 Too Many Requests: Implement rate limiting

## Soft Delete Behavior

### User Deletion
When a user account is deleted via the DELETE `/users/me` endpoint, it performs a soft delete:
- The user record remains in the database
- `deleted` flag is set to `true`
- `deletedAt` timestamp is recorded
- `deletedBy` field tracks who performed the deletion

### Query Behavior
- All user queries automatically exclude soft-deleted users by default
- Use `findAllWithDeleted()` method to include soft-deleted users in results
- Soft-deleted users cannot authenticate or access protected resources

### Recovery
- Soft-deleted accounts can be recovered by setting `deleted` to `false`
- Hard delete (permanent removal) is available via `hardDelete()` method

### API Response
```json
{
  "message": "Account deleted successfully",
  "deleted": true
}
```

### Best Practices
- Use soft delete for user account removal to maintain data integrity
- Implement proper audit logging for deletion operations
- Consider data retention policies for soft-deleted accounts
