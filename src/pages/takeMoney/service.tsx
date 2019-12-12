import { Request, Api } from '../../service'

export const list = data => Request({
  url: `${Api.book.list}`,
  method: 'GET',
  data
});

export default { list }