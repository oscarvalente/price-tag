import React, {Component} from "react";
import PropTypes from "prop-types";

import styles from "./options-list.scss";

const OptionsListContext = React.createContext();

const Option = ({name, id, isChecked}) =>
    <OptionsListContext.Consumer>
        {({optionsName, onChange}) => (
            <div className={styles["option-container"]}>
                {isChecked ?
                    <input className={styles.input} type="radio" name={optionsName} id={id} value={id} onChange={onChange} defaultChecked/>
                    :
                    <input className={styles.input} type="radio" name={optionsName} id={id} value={id} onChange={onChange}/>
                }
                <div className={styles["label-container"]}>
                    <label className={styles.label} htmlFor={id}>{name}</label>
                </div>
            </div>
        )}
    </OptionsListContext.Consumer>;

Option.propTypes = {
    name: PropTypes.string,
    id: PropTypes.string,
    isChecked: PropTypes.bool
};

class OptionsList extends Component {
    render() {
        return (
            <fieldset className={styles["options-fieldset"]}>
                <legend className={styles.legend}>{this.props.name}</legend>
                <OptionsListContext.Provider {...this.props}>
                    {this.props.children}
                </OptionsListContext.Provider>
            </fieldset>
        );
    }
}

OptionsList.propTypes = {
    name: PropTypes.string,
    onChange: PropTypes.func
};

export default OptionsList;
export {Option};
