/**
 * An action that can be anchored to an actionable panel.
 */
export interface ActionablePanelAction {
    iconClass: string;
    toggle?: boolean;
    pressed?: boolean | null | undefined;
    callback?: ActionCallback;
    menu?: ActionablePanelMenuItem[];
    title?: string;
}

export interface ActionablePanelMenuItem {
    label: string;
    action: () => void;
}

/**
 * The callback to call when an action button is clicked.
 */
export interface ActionCallback {

    /**
     * The callback to call when an action button is clicked.
     *
     * @param depressed Whether the button is depressed.  This will only ever be <code>true</code> if
     *        this is a toggle button.
     */
    (depressed: boolean): void;
}
