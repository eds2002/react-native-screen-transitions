import { useComponentNavigationContext } from "../navigators/create-component-navigator";

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
	return useComponentNavigationContext();
}
