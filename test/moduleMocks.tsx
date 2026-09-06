/**
 * Module mocks that must be registered before any test file's imports are
 * resolved, so they live in `preload` (see bunfig.toml) rather than in the test
 * files themselves.
 */
import "./googleMapsMock";
import "./nextMocks";
import "./nextNavigationMock";
import "./nextOgMock";
