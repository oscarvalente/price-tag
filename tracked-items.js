import {createElement} from "react";
import {render} from "react-dom";
import TrackedItems from "./src/pages/tracked-items";

function bootstrap() {
    render(createElement(TrackedItems), document.getElementById("tracked-items-page"));
}

bootstrap();
