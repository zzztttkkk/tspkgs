import { Item } from "./item.js";
import { IItemRenderer } from "./renderer.js";

export interface IChannel {
	get renderer(): IItemRenderer;

	filter(item: Item): boolean;
	emit(buf: Buffer): Promise<void>;
}
