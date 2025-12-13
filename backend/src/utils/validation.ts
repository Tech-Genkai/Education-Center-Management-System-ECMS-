export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[0-9]{7,15}$/;
// Require http/https scheme for full URLs
export const URL_REGEX = /^https?:\/\/[\w.-]+(?:\.[\w.-]+)+(?:[:\d]{2,5})?(?:[/?#][^\s]*)?$/i;
export const BIO_MAX_LENGTH = 280;
export const NAME_MAX_LENGTH = 80;

export const isAllowedProfileUrl = (value: string): boolean => {
	if (!value) return true;
	if (value.startsWith('/')) return true; // allow relative /static paths
	return URL_REGEX.test(value);
};
