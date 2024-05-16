import { Item } from "./item.js";

export interface Renderer {
	render(item: Item): string;
}
