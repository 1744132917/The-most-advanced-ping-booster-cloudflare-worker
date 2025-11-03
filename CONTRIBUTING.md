# Contributing to Ping Booster Worker

Thank you for your interest in contributing to the Ping Booster Cloudflare Worker! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Your environment (Node.js version, Wrangler version, etc.)
- Any relevant logs or error messages

### Suggesting Features

For feature requests, please create an issue with:
- A clear description of the feature
- The problem it solves
- How it would benefit users
- Any implementation ideas you might have

### Pull Requests

1. **Fork the repository** and create a new branch for your feature or fix
2. **Make your changes** following the code style guidelines
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Submit a pull request** with a clear description of the changes

## Development Setup

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Wrangler CLI

### Setup

```bash
# Clone your fork
git clone https://github.com/your-username/The-most-advanced-ping-booster-cloudflare-worker.git
cd The-most-advanced-ping-booster-cloudflare-worker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Testing

```bash
# Run syntax checks
node --check worker.js

# Test locally
npm run dev

# In another terminal, run tests
curl http://localhost:8787/health
```

## Code Style Guidelines

### JavaScript

- Use ES6+ features
- Use `const` and `let` instead of `var`
- Use arrow functions where appropriate
- Use template literals for string interpolation
- Add JSDoc comments for classes and methods
- Keep functions small and focused
- Use meaningful variable names

Example:
```javascript
/**
 * Checks the health of a backend server
 * @param {Object} backend - Backend configuration object
 * @returns {Promise<boolean>} - True if healthy, false otherwise
 */
async checkHealth(backend) {
  try {
    const response = await fetch(backend.url + '/health');
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

### Comments

- Add comments for complex logic
- Use JSDoc for classes and methods
- Keep comments up-to-date with code changes
- Avoid obvious comments

### Formatting

- Use 2 spaces for indentation
- Use semicolons
- Maximum line length: 100 characters
- One statement per line

## Project Structure

```
.
├── worker.js           # Main worker implementation
├── examples.js         # Client usage examples
├── wrangler.toml       # Cloudflare Workers configuration
├── package.json        # Node.js dependencies and scripts
├── README.md           # Main documentation
├── CONFIGURATION.md    # Configuration examples
├── DEPLOYMENT.md       # Deployment guide
├── CONTRIBUTING.md     # This file
└── LICENSE            # MIT License
```

## Feature Development

### Adding New Features

1. **Plan**: Discuss the feature in an issue first
2. **Design**: Consider how it fits with existing features
3. **Implement**: Write clean, testable code
4. **Document**: Update relevant documentation
5. **Test**: Ensure it works in various scenarios

### Feature Checklist

- [ ] Code follows style guidelines
- [ ] Feature is documented in README.md
- [ ] Configuration options are documented in CONFIGURATION.md
- [ ] Examples are added to examples.js (if applicable)
- [ ] Code is tested locally
- [ ] No breaking changes (or clearly documented)

## Testing Guidelines

### Manual Testing

Test your changes with:

1. **Health Check**
   ```bash
   curl http://localhost:8787/health
   ```

2. **Metrics**
   ```bash
   curl http://localhost:8787/metrics
   ```

3. **API Proxy**
   ```bash
   curl http://localhost:8787/api/your-endpoint
   ```

4. **WebSocket**
   ```bash
   wscat -c ws://localhost:8787/ws
   ```

### Test Different Scenarios

- Multiple concurrent requests
- Rate limiting behavior
- Cache hit/miss scenarios
- Backend failure handling
- WebSocket connection lifecycle

## Documentation

### README.md

- Keep the main README.md up-to-date
- Add examples for new features
- Update the features list
- Include troubleshooting tips

### CONFIGURATION.md

- Add configuration examples for new features
- Document all configuration options
- Provide use case examples

### Code Comments

- Add JSDoc comments for new classes and methods
- Document complex logic
- Explain non-obvious decisions

## Commit Messages

Follow the conventional commits specification:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(websocket): add connection timeout handling

Add timeout configuration for WebSocket connections to prevent
hanging connections when clients disconnect unexpectedly.

Closes #123
```

```
fix(cache): correct TTL calculation for edge cases

Fixed an issue where cache TTL was not correctly calculated
when the response had no explicit cache headers.
```

## Pull Request Process

1. **Create a branch** with a descriptive name:
   - `feat/feature-name`
   - `fix/bug-description`
   - `docs/what-changed`

2. **Make your changes** following the guidelines above

3. **Test thoroughly** before submitting

4. **Update documentation** as needed

5. **Submit PR** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots (if UI changes)
   - Test results

6. **Respond to feedback** promptly

7. **Squash commits** if requested

## Review Process

Maintainers will review your PR for:
- Code quality and style
- Test coverage
- Documentation completeness
- Breaking changes
- Security implications
- Performance impact

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a git tag
4. Deploy to production
5. Create GitHub release

## Getting Help

- Check existing issues and documentation
- Ask questions in issues or discussions
- Be patient and respectful

## Recognition

Contributors will be:
- Listed in the README.md (if desired)
- Mentioned in release notes
- Credited in commit messages

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

If you have questions about contributing, please:
- Open an issue for general questions
- Reference this guide for contribution guidelines
- Check the README.md for usage questions

Thank you for contributing to Ping Booster Worker!
