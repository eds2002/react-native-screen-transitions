# React Native Screen Transitions - E2E Tests

This directory contains Maestro-based end-to-end tests for the React Native Screen Transitions library.

## Prerequisites

1. **Install Maestro CLI**:
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   export PATH="$PATH":"$HOME/.maestro/bin"
   ```

2. **Start your app**:
   ```bash
   cd examples/e2e
   npm start
   # Then press 'i' for iOS or 'a' for Android
   ```

## Test Structure

### Single Route Tests

#### `single-routes-programmatic.yaml`
Tests basic programmatic navigation:
- Single route navigation (`/1`)
- Multi-step route navigation (`/2` → `/2/2-1`)
- Forward and back button functionality

#### `single-routes-gestures.yaml`
Tests gesture-based navigation:
- Horizontal swipe dismissal (`/gesture-horizontal`)
- Vertical swipe dismissal (`/gesture-vertical`)
- Bidirectional swipe dismissal (`/gesture-bidirectional`)

#### `single-routes-presets.yaml`
Tests transition animation presets:
- SlideFromTop preset with vertical gestures
- ZoomIn preset with scale animations
- ElasticCard preset with elastic interactions

#### `single-routes-edge-cases.yaml`
Tests edge cases and stress scenarios:
- Rapid navigation operations
- Animation interruption handling
- Custom callback functionality

#### `single-routes-complete.yaml`
Comprehensive test that runs all single route scenarios in sequence.

## Running Tests

### Run Individual Test Suites
```bash
# Test programmatic navigation only
maestro test flows/single-routes-programmatic.yaml

# Test gesture navigation only
maestro test flows/single-routes-gestures.yaml

# Test transition presets only
maestro test flows/single-routes-presets.yaml

# Test edge cases only
maestro test flows/single-routes-edge-cases.yaml
```

### Run Complete Test Suite
```bash
# Run all single route tests
maestro test flows/single-routes-complete.yaml

# Run all tests with configuration
maestro test .
```

### Run with Options
```bash
# Run with continuous mode (re-run on changes)
maestro test flows/single-routes-complete.yaml --continuous

# Run with debug output
maestro test flows/single-routes-complete.yaml --debug

# Run with custom device
maestro test flows/single-routes-complete.yaml --device-id <DEVICE_ID>
```

## Test Coverage

### ✅ Single Routes
- [x] Programmatic navigation (forward/back)
- [x] Multi-step route flows
- [x] Horizontal gesture dismissal
- [x] Vertical gesture dismissal
- [x] Bidirectional gesture dismissal
- [x] SlideFromTop transition preset
- [x] ZoomIn transition preset
- [x] ElasticCard transition preset
- [x] Rapid navigation stress testing
- [x] Animation interruption handling
- [x] Custom callback verification

### ✅ Nested Routes
- [x] Deep programmatic navigation (nested/a/one → nested/a/two → back)
- [x] Multi-level nested routing (nested/a/one → nested/a/b/one → nested/a/b/two)
- [x] Gesture dismissal from nested routes back to ROOT
- [x] Deep nested gesture dismissal with proper stack management
- [x] Parent navigator dismissal behavior

## Debugging Failed Tests

1. **Check Screenshots**: Failed tests automatically capture screenshots in the `screenshots/` directory
2. **Run with Debug**: Use `--debug` flag for verbose output
3. **Check App State**: Ensure the app is running and accessible
4. **Verify TestIDs**: Ensure all UI elements have proper `testID` attributes

## Test Configuration

The `.maestro.yaml` file contains:
- Test flow definitions
- Timeout configurations
- Retry settings for flaky tests
- Screenshot capture settings

## Contributing

When adding new test scenarios:
1. Create focused test files for specific features
2. Use descriptive test names and comments
3. Include proper assertions for state verification
4. Add appropriate wait times for animations
5. Update this README with new test coverage
