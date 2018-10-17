import React, {Component} from "react";

import styles from "./items-list.scss";
import Item, {IconContainer, StatusContainer, LabelContainer, DeleteButton} from "../item";

const mapItemsList = (items, onItemRemoved) =>
    items.map(item =>
        <li key={item.timestamp} className={styles["item-container"]}>
            <Item value={item}>
                <IconContainer/>
                <StatusContainer watchedTitle="Watched - item price is being watched"
                                 notFoundTitle="Not found - item price was not found in last check (please review item page)"
                                 higherTitle={`Higher price - price is higher than when you started tracking this item (${item.currentPrice})`}
                                 lowerTitle={`Save money - price is lower than when you started tracking this item (${item.startingPrice}). Now ${item.currentPrice}`}
                />
                <LabelContainer targetPriceTitle="Price the last time you marked it"/>
                <DeleteButton onItemRemoved={onItemRemoved} title="Remove item"/>
            </Item>
        </li>
    );

class ItemsList extends Component {
    render() {
        return (
            <ol id={styles["tracked-items-list"]}>
                {mapItemsList(this.props.items, this.props.onItemRemoved)}
            </ol>
        );
    }
}

export default ItemsList;
