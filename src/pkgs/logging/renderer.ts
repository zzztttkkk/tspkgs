import { Item } from "./item.js";

export interface IItemRenderer {
	render(dst: Buffer, Item: Item): void;
}
