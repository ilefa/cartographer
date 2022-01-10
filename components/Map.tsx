import MdiIcon from '@mdi/react';
import download from 'downloadjs';

import * as L from 'leaflet';
import * as Icons from '@mdi/js';

import { Modal } from './Modal';
import { LatLng } from 'leaflet';
import { useKeyPress } from '../hooks';
import { BuildingCode } from '@ilefa/husky';
import { DiningHallType } from '@ilefa/blueplate';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { BuildingAddresses, BuildingDescriptions, capitalizeFirst } from '../util';
import { MapContainer, Marker, Popup, TileLayer, useMapEvent } from 'react-leaflet';

import {
    mdiAlphabeticalVariant,
    mdiChairSchool,
    mdiClockTimeThree,
    mdiFoodForkDrink,
    mdiMapMarker,
    mdiTownHall
} from '@mdi/js';

import {
    Col,
    Collapse,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Form,
    FormGroup,
    Input,
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    Row,
    UncontrolledDropdown
} from 'reactstrap';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

type BuildingType = 'academic' | 'residential' | 'dining' | 'other';

enum BuildingColorType {
    ACADEMIC = 'text-primary',
    RESIDENTIAL = 'text-green',
    DINING = 'text-warning',
    OTHER = 'text-gray'
}

enum DayType {
    MONDAY = 'Monday',
    TUESDAY = 'Tuesday',
    WEDNESDAY = 'Wednesday',
    THURSDAY = 'Thursday',
    FRIDAY = 'Friday',
    SATURDAY = 'Saturday',
    SUNDAY = 'Sunday'
}

type MarkerHours = {
    day: string;
    open: string;
    close: string;
}

type MarkerProps = {
    name: string;
    position: LatLng;
    type: BuildingType;
    description: string | keyof typeof BuildingDescriptions;
    address: string | keyof typeof BuildingAddresses;
    classroomPrefixes?: string[];
    diningHallType?: string;
    hours?: MarkerHours[];
}

type PartialMarkerProps = {
    position: LatLng;
}

const Map = () => {
    const [file, setFile] = useState<File>(null);
    const [clicked, setClicked] = useState<boolean>(false);
    const [entries, setEntries] = useState<(MarkerProps | PartialMarkerProps)[]>([]);
    const [modal, setModal] = useState<MarkerProps | PartialMarkerProps>(null);
    const [fileModal, setFileModal] = useState(false);

    const fileSignal = useKeyPress('<');
    const saveSignal = useKeyPress('>');

    useEffect(() => fileSignal && setFileModal(true), [fileSignal]);
    useEffect(() => !modal && !fileModal && saveSignal && download(JSON.stringify(entries, null, 3), 'cartographer.json'), [saveSignal]);
    useEffect(() => {
        if (!file)
            return;

        const reader = new FileReader();
        reader.onload = () => {
            const data = JSON.parse(reader.result as string);
            if (entries.length > 0 && !confirm('Overwrite current workspace?'))
                return;
            
            setFileModal(false);
            setEntries(data);
        }

        reader.readAsBinaryString(file);
    }, [file]);

    function update<T>(pos: LatLng, field: keyof MarkerProps, value: T) {
        let entry = entries.find(e => e.position.lat === pos.lat && e.position.lng === pos.lng);
        if (!entry)
            return;

        setEntries(entries.map(e => e.position.lat === pos.lat && e.position.lng === pos.lng ? { ...e, [field]: value } : e));
        entries[entries.indexOf(entry)] = { ...entry, [field]: value };
    }

    const LeafIcon = L.Icon.extend({
        options: {}
    }) as any;

    const icons = {
        academic: new LeafIcon({ iconUrl: '/pins/blue-small.png' }),
        residential: new LeafIcon({ iconUrl: '/pins/green-small.png' }),
        dining: new LeafIcon({ iconUrl: '/pins/orange-small.png' }),
        other: new LeafIcon({ iconUrl: '/pins/gray-small.png' })
    }

    return (
        <MapContainer   
            center={[41.8059613, -72.2509286]}
            zoom={17}
            // scrollWheelZoom={true}
            style={{height: '100vh', width: '100%'}}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OSM</a>, <a href="https://ilefa.club">ILEFA Labs</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapHandlers entries={entries} clicked={clicked} setClicked={setClicked} setEntries={setEntries} setModal={setModal} />

            {
                entries.map(ent => (
                    <Marker
                        key={ent.position.lat + ent.position.lng}
                        position={[ent.position.lat, ent.position.lng]}
                        draggable
                        icon={icons[(ent as MarkerProps).type ?? 'other']}
                        eventHandlers={{
                            dragend: e => update<LatLng>(ent.position, 'position', e.target.getLatLng())
                        }}
                    >
                        <Popup>
                            <span className={`${BuildingColorType[or<BuildingType>(ent, 'type', 'other').toUpperCase()]} font-weight-bold`}>[{capitalizeFirst(or<BuildingType>(ent, 'type', 'other'))}]</span> <b>{or<string>(ent, 'name', 'Unknown Marker')}</b> at <span className="text-green">{formatLatLng(ent.position)}</span>
                            <br /> <div className="mt-3 mb--3"><pre className="text-primary">{JSON.stringify(ent, null, 3)}</pre></div><br />
                            <div className="">
                                <span className="text-primary cursor-pointer shine mr-2" onClick={_ => {
                                    setModal(ent);
                                }}>edit</span>{" "}
                                <span className="text-danger cursor-pointer shine" onClick={_ => {
                                    setEntries(entries.filter(item => item.position !== ent.position));
                                    setClicked(null);
                                }}>remove</span>
                            </div>
                        </Popup>
                    </Marker>
                ))
            }

            {
                fileModal && (
                    <Modal
                        open={fileModal}
                        setOpen={_ => setFileModal(false)}
                        width={'850px'}
                        title={'Ingest Cartographer Archive'}
                    >
                        <Form>
                            <FormGroup>
                                <InputGroup>
                                    <Input type="file" onChange={e => setFile(e.target.files[0])} />
                                </InputGroup>
                            </FormGroup>
                        </Form>
                    </Modal>
                )
            }

            {
                (modal && !fileModal) &&
                    <MarkerEditorModal
                        open={!!modal}
                        setOpen={() => setModal(null)}
                        commit={marker => {
                            let index = entries.findIndex(ent => ent.position === marker.position);
                            entries[index] = marker;
                            setEntries(entries);
                        }}
                        destroy={() => {
                            setModal(null);
                            setClicked(false);
                            setEntries(entries.filter(ent => ent.position !== modal.position));
                        }}
                        marker={modal}
                    />
            }
        </MapContainer>
    )
}

const formatLatLng = (pos: LatLng) => `${pos.lat.toFixed(7)}, ${pos.lng.toFixed(7)}`;

interface MapHandlersProps {
    entries: (MarkerProps | PartialMarkerProps)[];
    clicked: boolean;
    setClicked: Dispatch<boolean>;
    setEntries: Dispatch<SetStateAction<(MarkerProps | PartialMarkerProps)[]>>;
    setModal: Dispatch<SetStateAction<MarkerProps | PartialMarkerProps>>;
}

// only used for initial marker creation, since edit button exists on marker popup
const MapHandlers: React.FC<MapHandlersProps> = ({ entries, clicked, setClicked, setEntries, setModal }) => {
    useMapEvent('click', e => {
        if (!clicked) {
            setEntries(entries
                ? [...entries, { position: e.latlng }]
                : [{ position: e.latlng }]);
            setClicked(true);
            setModal({ position: e.latlng });
            return;
        }

        setClicked(false);
    });

    return <></>;
}

interface MarkerHoursEditorModalProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    commit: (hours: MarkerHours[]) => void;
    store: MarkerProps;
}

const MarkerHoursEditorModal: React.FC<MarkerHoursEditorModalProps> = ({ open, setOpen, commit, store }) => {
    const [hours, setHours] = useState<MarkerHours[]>(or<MarkerHours[]>(store, 'hours', []));

    const title = (
        <span>
            <span className="text-primary-light">Editing Hours:</span> {" "}
            <span className="text-magenta">{store.name ?? 'Unknown Marker'}</span>
        </span>
    );

    function update<T>(day: number, field: keyof MarkerHours, value: T) {
        if (!hours[day])
            (hours[day] as any) = { day };

        (hours[day] as any)[field] = value;
        setHours(hours);
        commit(hours);
    }

    return (
        <Modal
            open={open}
            setOpen={setOpen}
            width={'850px'}
            title={title}
            footerButtons={
                <>
                    <span
                        className="btn btn-link text-lowercase mr-auto"
                        onClick={() => {
                            let response = prompt('Enter day number to clone (1-7)');
                            if (!response || isNaN(parseInt(response)))
                                return;

                            let day = parseInt(response);
                            if (day < 1 || day > 7)
                                return;

                            let clone = hours[day - 1];
                            if (!clone)
                                return;

                            Object.keys(DayType).forEach((_day, i) => {
                                update<string>(i, 'open', clone.open);
                                update<string>(i, 'close', clone.close);
                            })
                        }}>
                            <i className="fa fa-clone fa-fw"></i> set all times
                    </span>
                    <span
                        className={`btn btn-link text-lowercase ml--28`}
                        onClick={() => Object.keys(DayType).forEach((_, i) => {
                            update<string>(i, 'open', null);
                            update<string>(i, 'close', null);
                        })}>
                            <i className={`fa fa-history fa-fw`}></i> reset all
                    </span>
                </>
            }>
                <Form>
                    <Row>
                        {
                            Object.keys(DayType).map((type, i) => (
                                <>
                                    <Col key={type} md="6">
                                        <FormGroup>
                                            <InputGroup className="mb-4">
                                                <InputGroupAddon addonType="prepend">
                                                    <InputGroupText>
                                                        <MdiIcon path={Icons[`mdiAlpha${type.substring(0, 1).toUpperCase()}Box`]} size="20px" />
                                                        <span className="ml-2 vaMiddle">Opens at</span>
                                                    </InputGroupText>
                                                </InputGroupAddon>
                                                <Input placeholder="Open" type="time" value={store.hours ? store.hours[i]?.open : null} onChange={e => update<string>(i, 'open', e.target.value)} />
                                            </InputGroup>
                                        </FormGroup>
                                    </Col>
                                    <Col key={type} md="6">
                                        <FormGroup>
                                            <InputGroup className="mb-4">
                                                <InputGroupAddon addonType="prepend">
                                                    <InputGroupText>
                                                        {/* <MdiIcon path={Icons[`mdiNumeric${i + 1}Box`]} size="20px" /> */}
                                                        Closes at
                                                    </InputGroupText>
                                                </InputGroupAddon>
                                                <Input placeholder="Close" type="time" value={store.hours ? store.hours[i]?.close : null} onChange={e => update<string>(i, 'close', e.target.value)} />
                                            </InputGroup>
                                        </FormGroup>
                                    </Col>
                                </>
                            ))
                        }
                    </Row>
                </Form>
        </Modal>
    );
}

interface MarkerEditorModalProps {
    open: boolean;
    setOpen: (state: boolean) => void;
    commit: (marker: MarkerProps) => void;
    destroy: () => void;
    marker: MarkerProps | PartialMarkerProps;
}

function or<T>(x: (MarkerProps | PartialMarkerProps) | null, field: keyof MarkerProps, orElse = null): T | null {
    return x && x[field]
        ? x[field] as T
        : orElse;
}


const MarkerEditorModal: React.FC<MarkerEditorModalProps> = ({ open, setOpen, commit, destroy, marker }) => {
    const [store, setStore] = useState<MarkerProps>({
        name: or<string>(marker, 'name'),
        position: or<LatLng>(marker, 'position'),
        address: or<string>(marker, 'address'),
        description: or<string>(marker, 'description'),
        type: or<BuildingType>(marker, 'type'),
        classroomPrefixes: or<string[]>(marker, 'classroomPrefixes', []),
        diningHallType: or<string>(marker, 'diningHallType'),
        hours: or<MarkerHours[]>(marker, 'hours')
    });

    const [hourModal, setHourModal] = useState(false);
    const [rawData, setRawData] = useState(false);

    const title = (
        <span>
            <span className="text-primary-light font-weight-bold">{store.name ?? 'Unknown Marker'}</span>
            {" "} at {" "}
            <code className="text-green">{formatLatLng(store.position)}</code>
        </span>
    );

    const processBuildingAddress = (value: string) => {
        if (value.startsWith('@presets/')) {
            let key = value.split('@presets/')[1].toUpperCase();
            if (key in BuildingAddresses)
                value = BuildingAddresses[key];
        }

        update<string>('address', value);
    }

    const processBuildingDescription = (value: string) => {
        if (value.startsWith('@presets/')) {
            let key = value.split('@presets/')[1].toUpperCase();
            if (key in BuildingDescriptions)
                value = BuildingDescriptions[key];
        }

        update<string>('description', value);
    }

    function update<T>(field: keyof MarkerProps, value: T) {
        setStore({ ...store, [field]: value });
        (store[field] as any) = value;
        commit(store);
    }

    return (
        <Modal
            open={open}
            setOpen={setOpen}
            width={'850px'}
            title={title}
            footerButtons={
                <>
                    <span
                        className="btn btn-link text-lowercase text-danger mr-auto"
                        onClick={() => destroy()}>
                            <i className="fa fa-times fa-fw"></i> delete
                    </span>
                </>
            }>
                <Form>
                    <Row>
                        <Col md="4">
                            <FormGroup>
                                <InputGroup className="mb-4">
                                    <InputGroupAddon addonType="prepend">
                                        <InputGroupText>
                                            <MdiIcon path={mdiAlphabeticalVariant} size="20px" />
                                        </InputGroupText>
                                    </InputGroupAddon>
                                    <Input placeholder="Name" type="text" value={store.name} onChange={e => update<string>('name', e.target.value)} />
                                </InputGroup>
                            </FormGroup>
                        </Col>
                        <Col md="5">
                            <FormGroup>
                                <InputGroup className="mb-4">
                                    <InputGroupAddon addonType="prepend">
                                        <InputGroupText>
                                            <MdiIcon path={mdiMapMarker} size="20px" />
                                        </InputGroupText>
                                    </InputGroupAddon>
                                    <Input placeholder="Address" type="text" value={store.address} onChange={e => processBuildingAddress(e.target.value)} />
                                </InputGroup>
                            </FormGroup>
                        </Col>
                        <Col md="3">
                            <UncontrolledDropdown className="dropdown-width">
                                <DropdownToggle caret color="white" className="text-capitalize text-left shadow-none dropdown-button dropdown-width dropdown-placeholder" onClick={() => setHourModal(true)}>
                                    <MdiIcon path={mdiClockTimeThree} size="20px" className="fa-fw vaSub mr-2" /> Hours
                                </DropdownToggle>
                                <MarkerHoursEditorModal
                                    open={hourModal}
                                    setOpen={() => setHourModal(false)}
                                    store={store}
                                    commit={hours => update<MarkerHours[]>('hours', hours)}
                                />
                            </UncontrolledDropdown>
                        </Col>
                    </Row>
                    <Row>
                        <Col md="12">
                            <Input
                                className="form-control mb-4"
                                placeholder="Description"
                                rows="3"
                                type="textarea"
                                value={store.description}
                                onChange={e => processBuildingDescription(e.target.value)}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col md="6">
                            <UncontrolledDropdown className="dropdown-width">
                                <DropdownToggle caret color="white" className="text-capitalize text-left shadow-none dropdown-button dropdown-width dropdown-placeholder">
                                    <MdiIcon path={mdiTownHall} size="20px" className="fa-fw vaSub mr-2" /> {store.type ?? 'Building Type'}
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem href="#" className={store.type === 'academic' ? 'bg-primary text-white' : ''} onClick={() => update<BuildingType>('type', 'academic')}>
                                        Academic
                                    </DropdownItem>
                                    <DropdownItem href="#" className={store.type === 'residential' ? 'bg-primary text-white' : ''} onClick={() => update<BuildingType>('type', 'residential')}>
                                        Residential
                                    </DropdownItem>
                                    <DropdownItem href="#" className={store.type === 'dining' ? 'bg-primary text-white' : ''} onClick={() => update<BuildingType>('type', 'dining')}>
                                        Dining Hall
                                    </DropdownItem>
                                    <DropdownItem href="#" className={store.type === 'other' ? 'bg-primary text-white' : ''} onClick={() => update<BuildingType>('type', 'other')}>
                                        Miscellaneous
                                    </DropdownItem>
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        </Col>
                        {
                            (store.type === 'academic' || store.type === 'dining') && (
                                <Col md="6">
                                    <FormGroup>
                                        <InputGroup className="mb-4">
                                            {
                                                store.type === 'academic' &&
                                                    <UncontrolledDropdown className="dropdown-width dropdown-fix">
                                                        <DropdownToggle caret color="white" className="text-capitalize text-left shadow-none dropdown-button dropdown-width dropdown-placeholder">
                                                            <MdiIcon path={mdiChairSchool} size="20px" className="fa-fw vaSub mr-2" />
                                                            {
                                                                store.classroomPrefixes.length
                                                                    ? store
                                                                        .classroomPrefixes
                                                                        .sort((a, b) => a.localeCompare(b))
                                                                        .slice(0, 3)
                                                                        .join(', ') + (store.classroomPrefixes.length > 3 ? ` +${store.classroomPrefixes.length - 3}` : '')
                                                                    : 'Classroom Prefixes'
                                                            }
                                                        </DropdownToggle>
                                                        <DropdownMenu>
                                                            {
                                                                Object.keys(BuildingCode).map(code => (
                                                                    <DropdownItem
                                                                        key={code}
                                                                        href="#"
                                                                        className={store.classroomPrefixes.includes(code) ? 'bg-primary text-white' : ''}
                                                                        onClick={() => update<string[]>('classroomPrefixes', store.classroomPrefixes.includes(code)
                                                                            ? store.classroomPrefixes.filter(ent => ent !== code)
                                                                            : [...store.classroomPrefixes, code])}
                                                                    >
                                                                        <b>[{code}]</b> {BuildingCode[code]}
                                                                    </DropdownItem>       
                                                                ))
                                                            }
                                                        </DropdownMenu>
                                                    </UncontrolledDropdown>
                                            }
                                            {
                                                store.type === 'dining' && 
                                                    <UncontrolledDropdown className="dropdown-width">
                                                        <DropdownToggle caret color="white" className="text-capitalize text-left shadow-none dropdown-button dropdown-width dropdown-placeholder">
                                                            <MdiIcon path={mdiFoodForkDrink} size="20px" className="fa-fw vaSub mr-2" /> Dining Hall
                                                        </DropdownToggle>
                                                        <DropdownMenu>
                                                            {
                                                                Object.keys(DiningHallType).map(code => (
                                                                    <DropdownItem
                                                                        key={code}
                                                                        href="#"
                                                                        className={store.diningHallType === code ? 'bg-primary text-white' : ''}
                                                                        onClick={() => update<string>('diningHallType', code)}
                                                                    >
                                                                        {DiningHallType[code]}
                                                                    </DropdownItem>       
                                                                ))
                                                            }
                                                        </DropdownMenu>
                                                    </UncontrolledDropdown>
                                            }
                                        </InputGroup>
                                    </FormGroup>
                                </Col>
                            )
                        }
                    </Row>
                </Form>
                <hr />
                <div className="mt--3 ml-2">
                    <span className="text-primary font-weight-bold"><i className="fa fa-code fa-fw"></i> Raw Data</span>
                    <br /><span onClick={() => setRawData(!rawData)}>Click to {rawData ? 'disable' : 'enable'}</span>
                    <Collapse isOpen={rawData} className="mt-3">
                        <pre className="text-primary">
                            {JSON.stringify(store, null, 3)}
                        </pre>
                    </Collapse>
                </div>
        </Modal>
    );
}

export default Map;
