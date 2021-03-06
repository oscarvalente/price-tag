import React, {Component} from "react";
import PropTypes from "prop-types";

import styles from "./items-list.scss";
import Item, {IconContainer, StatusContainer, LabelContainer, DeleteButton} from "../item";

const createItemsList = (items, generateOnItemRemovedCallback) =>
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
                <DeleteButton onItemRemoved={generateOnItemRemovedCallback(item.url)} title="Remove item"/>
            </Item>
        </li>
    );

class ItemsList extends Component {
    render() {
        return (
            <ol id={styles["tracked-items-list"]}>
                {createItemsList(this.props.items, this.props.generateOnItemRemovedCallback)}
            </ol>
        );
    }
}

ItemsList.propTypes = {
    items: PropTypes.array,
    generateOnItemRemovedCallback: PropTypes.func
};

export default ItemsList;
