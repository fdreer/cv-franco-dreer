const like = 'is-liked'

const isLiked = () => localStorage.getItem(like)
const setLike = () => localStorage.setItem(like, 'true')
const removeLike = () => localStorage.removeItem(like)

export { isLiked, setLike, removeLike }
