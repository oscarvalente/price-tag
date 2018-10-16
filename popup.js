import {createElement} from "react";
import {render} from "react-dom";
import Popup from "./src/pages/popup";

function bootstrap() {
    render(createElement(Popup), document.getElementById('popup-page'));
}

bootstrap();

