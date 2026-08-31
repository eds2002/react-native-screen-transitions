type LeaseClaim = Readonly<{
	ownerId: string;
	participantId: string;
	driverId: number;
	onConflict: () => void;
}>;

export type SmoothClipLeaseResolution = "missing" | "exclusive" | "ambiguous";

const claimsOverlap = (left: LeaseClaim, right: LeaseClaim) =>
	left.participantId === right.participantId ||
	left.driverId === right.driverId;

/**
 * Process-wide participant/driver leases used to prevent two screen
 * coordinators from promoting the same native view during transient overlap.
 *
 * There is no first-writer winner: every overlapping claim is ambiguous and
 * must stream. Existing native owners are notified when a new claim turns an
 * exclusive lease into an ambiguous one.
 */
export class SmoothClipLeaseRegistry {
	private readonly claimsByOwner = new Map<string, Map<string, LeaseClaim>>();

	private getClaims(): LeaseClaim[] {
		const claims: LeaseClaim[] = [];

		for (const ownerClaims of this.claimsByOwner.values()) {
			for (const claim of ownerClaims.values()) {
				claims.push(claim);
			}
		}

		return claims;
	}

	private isClaimExclusive(claim: LeaseClaim, claims: readonly LeaseClaim[]) {
		for (const other of claims) {
			if (other === claim) {
				continue;
			}

			if (claimsOverlap(claim, other)) {
				return false;
			}
		}

		return true;
	}

	claim(claim: LeaseClaim) {
		const previousClaims = this.getClaims();
		const previouslyExclusive = new Map<LeaseClaim, boolean>();

		for (const previousClaim of previousClaims) {
			previouslyExclusive.set(
				previousClaim,
				this.isClaimExclusive(previousClaim, previousClaims),
			);
		}

		let ownerClaims = this.claimsByOwner.get(claim.ownerId);
		if (!ownerClaims) {
			ownerClaims = new Map();
			this.claimsByOwner.set(claim.ownerId, ownerClaims);
		}
		ownerClaims.set(claim.participantId, claim);

		const nextClaims = this.getClaims();
		const ownersToNotify = new Map<string, () => void>();

		for (const previousClaim of previousClaims) {
			if (previousClaim.ownerId === claim.ownerId) {
				continue;
			}

			if (
				previouslyExclusive.get(previousClaim) === true &&
				!this.isClaimExclusive(previousClaim, nextClaims)
			) {
				ownersToNotify.set(previousClaim.ownerId, previousClaim.onConflict);
			}
		}

		for (const notify of ownersToNotify.values()) {
			notify();
		}
	}

	release(ownerId: string, participantId: string) {
		const ownerClaims = this.claimsByOwner.get(ownerId);
		if (!ownerClaims) {
			return;
		}

		ownerClaims.delete(participantId);
		if (ownerClaims.size === 0) {
			this.claimsByOwner.delete(ownerId);
		}
	}

	releaseOwner(ownerId: string) {
		this.claimsByOwner.delete(ownerId);
	}

	resolve(ownerId: string, participantId: string): SmoothClipLeaseResolution {
		const claim = this.claimsByOwner.get(ownerId)?.get(participantId);
		if (!claim) {
			return "missing";
		}

		return this.isClaimExclusive(claim, this.getClaims())
			? "exclusive"
			: "ambiguous";
	}

	clear() {
		this.claimsByOwner.clear();
	}
}

export const globalSmoothClipLeaseRegistry = new SmoothClipLeaseRegistry();
