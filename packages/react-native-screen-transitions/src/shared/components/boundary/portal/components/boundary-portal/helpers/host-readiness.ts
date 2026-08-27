export const resolveReadyPortalHostName = ({
	currentReadyHostName,
	hostName,
	ready,
}: {
	currentReadyHostName: string | null;
	hostName: string;
	ready: boolean;
}) => {
	"worklet";

	if (ready) return hostName;
	return currentReadyHostName === hostName ? null : currentReadyHostName;
};
