import { product } from './product'
import { category } from './category'
import { subcategory } from './subcategory'
import { order } from './order'
import { user } from './user'

export const schema = {
  types: [product, category, subcategory, order, user],
}
