# Pull Request Template

## Description

Please provide a brief description of the changes in this PR.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing

Please describe the tests that you ran to verify your changes:

- [ ] Unit tests pass (`npm test`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Manual testing completed
- [ ] Extension loads without errors
- [ ] Core functionality verified on multiple sites

## Manual Testing Checklist

- [ ] Extension installs successfully
- [ ] Popup opens and controls work
- [ ] Overlay appears/disappears correctly
- [ ] Intensity slider functions properly
- [ ] Color picker works
- [ ] Video exclusion toggles correctly
- [ ] Whitelist functionality works
- [ ] Options page is accessible and functional
- [ ] Fullscreen detection works
- [ ] SPA navigation handling works
- [ ] Cross-origin iframe behavior documented
- [ ] Performance is acceptable

## Code Quality Checklist

- [ ] Code follows TypeScript strict mode standards
- [ ] ESLint passes without errors (`npm run lint`)
- [ ] Code is properly formatted (`npm run format`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] No `any` types used without justification
- [ ] Error handling is comprehensive
- [ ] Accessibility features maintained
- [ ] Performance impact considered

## Screenshots

If applicable, add screenshots to help explain your changes.

## Additional Notes

Add any other context about the pull request here.

---

**Reviewer Checklist:**

- [ ] Code review completed
- [ ] Tests run locally: `npm install && npm run build && npm test`
- [ ] Manual testing performed
- [ ] Documentation updated if needed
- [ ] Breaking changes documented
- [ ] Performance impact acceptable
