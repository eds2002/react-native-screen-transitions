import { useComponentNavigationContext } from "../utils/with-component-navigation";

/**
 * Hook to access the component navigation object from within a screen.
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   const navigation = useComponentNavigation();
 *
 *   return (
 *     <Button
 *       title="Go to Details"
 *       onPress={() => navigation.push('Details')}
 *     />
 *   );
 * }
 * ```
 */
export function useComponentNavigation() {
	const context = useComponentNavigationContext();
	return context.navigation;
}
