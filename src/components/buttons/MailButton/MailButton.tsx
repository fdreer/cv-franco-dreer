import { Toaster, toast } from 'sonner'

const MailButton = () => {
	const handleClick = () => {
		navigator.clipboard.writeText('francodreer@gmail.com')
		toast('Email copiado en el portapapeles')
	}

	return (
		<button type="button" className="social-button" onClick={handleClick}>
			<Toaster position="top-center" />

			<svg
				xmlns="http://www.w3.org/2000/svg"
				height="25"
				width="25"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="lucide lucide-mail size-4"
			>
				<title>Mail Icon</title>
				<rect width="20" height="16" x="2" y="4" rx="2"></rect>
				<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
			</svg>
		</button>
	)
}
export default MailButton
