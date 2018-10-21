import React, {Component} from "react";
import PropTypes from "prop-types";

// import styles from "./options-list.scss";

const OptionsListContext = React.createContext();

const Option = ({name, id, isChecked}) =>
    <OptionsListContext.Consumer>
        {({optionsName, onChange}) => (
            <div>
                {isChecked ?
                    <input type="radio" name={optionsName} id={id} value={id} onChange={onChange} defaultChecked/>
                    :
                    <input type="radio" name={optionsName} id={id} value={id} onChange={onChange}/>
                }
                <label htmlFor={id}>{name}</label>
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
            <fieldset>
                <legend>{this.props.name}</legend>
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
