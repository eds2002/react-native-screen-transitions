#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Lets a screen's plain scroll views (ScrollView, FlatList... not wrapped by the library) hand
 * gestures to the screen the way Transition.ScrollView does.
 *
 * A zero-size view placed in a screen's content. When a finger lands in its parent, it finds the
 * plain scroll views under the finger, makes each one's pan wait on the screen's gestures (by
 * handler tag, `waitFor`), and reports their offset, content size, size and touch state
 * (`onScrollObserved`), which the library writes into the screen's scroll store.
 */
@interface RNSTScrollObserver : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END
