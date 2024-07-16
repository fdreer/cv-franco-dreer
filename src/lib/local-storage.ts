const like = 'is-liked'

/**
 * Se utiliza para saber si el usuario le gusta el cv
 */
const isLiked = () => localStorage.getItem(like)
const setLike = () => localStorage.setItem(like, 'true')
const removeLike = () => localStorage.removeItem(like)

export { isLiked, setLike, removeLike }
