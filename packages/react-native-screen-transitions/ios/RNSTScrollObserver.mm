#import "RNSTScrollObserver.h"

#import <UIKit/UIGestureRecognizerSubclass.h>
#import <react/renderer/components/RNScreenTransitionsSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNScreenTransitionsSpec/EventEmitters.h>
#import <react/renderer/components/RNScreenTransitionsSpec/Props.h>
#import <react/renderer/components/RNScreenTransitionsSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

#include <algorithm>
#include <vector>

using namespace facebook::react;

static void *RNSTScrollObserverContext = &RNSTScrollObserverContext;

@class RNSTScrollObserver;

@interface RNSTScrollObserver ()
- (void)touchesBeganIn:(NSSet<UITouch *> *)touches;
- (void)touchesFinished;
@end

/**
 * Sees every touch in the observer's parent without taking part: it never recognizes, cancels or
 * delays anything, so the views under the finger get their touches as they would without it.
 */
@interface RNSTTouchWatcher : UIGestureRecognizer <UIGestureRecognizerDelegate>
@property (nonatomic, weak) RNSTScrollObserver *owner;
@end

@implementation RNSTTouchWatcher

- (instancetype)initWithOwner:(RNSTScrollObserver *)owner
{
  if (self = [super initWithTarget:nil action:nil]) {
    _owner = owner;
    self.cancelsTouchesInView = NO;
    self.delaysTouchesBegan = NO;
    self.delaysTouchesEnded = NO;
    self.delegate = self;
  }
  return self;
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];
  [_owner touchesBeganIn:touches];
}

- (void)finishIfLastTouch:(UIEvent *)event touches:(NSSet<UITouch *> *)touches
{
  NSUInteger active = 0;
  for (UITouch *touch in event.allTouches) {
    if (touch.phase != UITouchPhaseEnded && touch.phase != UITouchPhaseCancelled && ![touches containsObject:touch]) {
      active++;
    }
  }
  if (active == 0) {
    [_owner touchesFinished];
    self.state = UIGestureRecognizerStateFailed;
  }
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];
  [self finishIfLastTouch:event touches:touches];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];
  [self finishIfLastTouch:event touches:touches];
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
    shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  return YES;
}

- (BOOL)canPreventGestureRecognizer:(UIGestureRecognizer *)preventedGestureRecognizer
{
  return NO;
}

- (BOOL)canBePreventedByGestureRecognizer:(UIGestureRecognizer *)preventingGestureRecognizer
{
  return NO;
}

@end

@interface RNSTScrollObserver () <RCTRNSTScrollObserverViewProtocol>
@end

@implementation RNSTScrollObserver {
  RNSTTouchWatcher *_watcher;
  NSHashTable<UIScrollView *> *_observed;
  NSHashTable<UIScrollView *> *_touched;
  /** Screen gesture recognizers each scroll view already waits on. */
  NSMapTable<UIScrollView *, NSHashTable<UIGestureRecognizer *> *> *_waiting;
  std::vector<int> _waitFor;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNSTScrollObserverComponentDescriptor>();
}

+ (BOOL)shouldBeRecycled
{
  return NO;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNSTScrollObserverProps>();
    _props = defaultProps;
    _observed = [NSHashTable weakObjectsHashTable];
    _touched = [NSHashTable weakObjectsHashTable];
    _waiting = [NSMapTable weakToStrongObjectsMapTable];
    _watcher = [[RNSTTouchWatcher alloc] initWithOwner:self];
    self.userInteractionEnabled = NO;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<RNSTScrollObserverProps const>(props);
  _waitFor = newProps.waitFor;
  [super updateProps:props oldProps:oldProps];
}

#pragma mark - Attaching

- (void)willMoveToSuperview:(UIView *)newSuperview
{
  [super willMoveToSuperview:newSuperview];
  [_watcher.view removeGestureRecognizer:_watcher];
  if (!newSuperview) {
    [self stopObserving];
  }
}

- (void)didMoveToSuperview
{
  [super didMoveToSuperview];
  if (self.superview) {
    [self.superview addGestureRecognizer:_watcher];
  }
}

- (void)dealloc
{
  [_watcher.view removeGestureRecognizer:_watcher];
  [self stopObserving];
}

#pragma mark - Touches

- (void)touchesBeganIn:(NSSet<UITouch *> *)touches
{
  UIView *root = self.superview;
  for (UITouch *touch in touches) {
    for (UIView *view = touch.view; view && view != root; view = view.superview) {
      if (![view isKindOfClass:UIScrollView.class]) {
        continue;
      }
      UIScrollView *scrollView = (UIScrollView *)view;
      if ([self isCoordinated:scrollView]) {
        continue;
      }
      [self observe:scrollView];
      [self waitOnScreenGestures:scrollView];
      [_touched addObject:scrollView];
      [self report:scrollView];
    }
  }
}

- (void)touchesFinished
{
  NSArray<UIScrollView *> *touched = _touched.allObjects;
  [_touched removeAllObjects];
  for (UIScrollView *scrollView in touched) {
    [self report:scrollView];
  }
}

#pragma mark - Gesture priority

static NSNumber *_Nullable RNSTHandlerTag(UIGestureRecognizer *recognizer)
{
  SEL handlerSelector = NSSelectorFromString(@"gestureHandler");
  if (![recognizer respondsToSelector:handlerSelector]) {
    return nil;
  }
  id handler = [recognizer valueForKey:@"gestureHandler"];
  if (!handler || ![handler respondsToSelector:NSSelectorFromString(@"tag")]) {
    return nil;
  }
  id tag = [handler valueForKey:@"tag"];
  return [tag isKindOfClass:NSNumber.class] ? tag : nil;
}

/** Already coordinated by gesture-handler (a Transition.ScrollView): the library's JS path owns it. */
- (BOOL)isCoordinated:(UIScrollView *)scrollView
{
  for (UIView *view in @[ scrollView, scrollView.superview ?: scrollView ]) {
    for (UIGestureRecognizer *recognizer in view.gestureRecognizers) {
      if (RNSTHandlerTag(recognizer)) {
        return YES;
      }
    }
  }
  return NO;
}

/** The scroll view's pan waits for the screen's gestures to fail, as Transition.ScrollView's does. */
- (void)waitOnScreenGestures:(UIScrollView *)scrollView
{
  if (_waitFor.empty()) {
    return;
  }
  NSHashTable<UIGestureRecognizer *> *waiting = [_waiting objectForKey:scrollView];
  if (!waiting) {
    waiting = [NSHashTable weakObjectsHashTable];
    [_waiting setObject:waiting forKey:scrollView];
  }
  for (UIView *view = scrollView.superview; view; view = view.superview) {
    for (UIGestureRecognizer *recognizer in view.gestureRecognizers) {
      NSNumber *tag = RNSTHandlerTag(recognizer);
      if (!tag || [waiting containsObject:recognizer]) {
        continue;
      }
      if (std::find(_waitFor.begin(), _waitFor.end(), tag.intValue) == _waitFor.end()) {
        continue;
      }
      [scrollView.panGestureRecognizer requireGestureRecognizerToFail:recognizer];
      [waiting addObject:recognizer];
    }
  }
}

#pragma mark - Reporting

- (void)observe:(UIScrollView *)scrollView
{
  if ([_observed containsObject:scrollView]) {
    return;
  }
  [_observed addObject:scrollView];
  for (NSString *keyPath in @[ @"contentOffset", @"contentSize", @"frame" ]) {
    [scrollView addObserver:self forKeyPath:keyPath options:0 context:RNSTScrollObserverContext];
  }
}

- (void)stopObserving
{
  for (UIScrollView *scrollView in _observed.allObjects) {
    for (NSString *keyPath in @[ @"contentOffset", @"contentSize", @"frame" ]) {
      [scrollView removeObserver:self forKeyPath:keyPath context:RNSTScrollObserverContext];
    }
  }
  [_observed removeAllObjects];
  [_touched removeAllObjects];
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary<NSKeyValueChangeKey, id> *)change
                       context:(void *)context
{
  if (context != RNSTScrollObserverContext) {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
    return;
  }
  [self report:(UIScrollView *)object];
}

static BOOL RNSTIsHorizontal(UIScrollView *scrollView)
{
  const CGSize content = scrollView.contentSize;
  const CGSize size = scrollView.bounds.size;
  return content.width > size.width + 0.5 && content.height <= size.height + 0.5;
}

- (void)report:(UIScrollView *)scrollView
{
  if (!_eventEmitter) {
    return;
  }
  const BOOL horizontal = RNSTIsHorizontal(scrollView);
  RNSTScrollObserverEventEmitter::OnScrollObserved event{
      .horizontal = (bool)horizontal,
      .offset = horizontal ? scrollView.contentOffset.x : scrollView.contentOffset.y,
      .contentSize = horizontal ? scrollView.contentSize.width : scrollView.contentSize.height,
      .layoutSize = horizontal ? scrollView.bounds.size.width : scrollView.bounds.size.height,
      .isTouched = (bool)[_touched containsObject:scrollView],
  };
  std::static_pointer_cast<const RNSTScrollObserverEventEmitter>(_eventEmitter)->onScrollObserved(event);
}

@end

Class<RCTComponentViewProtocol> RNSTScrollObserverCls(void)
{
  return RNSTScrollObserver.class;
}
