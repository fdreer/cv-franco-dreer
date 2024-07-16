import { Notyf } from 'notyf'

const notyf = new Notyf({
	duration: 3000,
	position: {
		x: 'center',
		y: 'top'
	}
})

export const toast = (msg: string) => {
	notyf.success(msg)
}
