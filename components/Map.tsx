import MdiIcon from '@mdi/react';
import download from 'downloadjs';

import * as L from 'leaflet';

import { Modal } from './Modal';
import { LatLng } from 'leaflet';
import { useKeyPress } from '../hooks';
import { BuildingCode } from '@ilefa/husky';
import { DiningHallType } from '@ilefa/blueplate';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { BuildingAddresses, BuildingDescriptions } from '../util';
import { MapContainer, Marker, Popup, TileLayer, useMapEvent } from 'react-leaflet';

import {
    mdiAlphabeticalVariant,
    mdiChairSchool,
    mdiFoodForkDrink,
    mdiMapMarker,
    mdiTimerSand,
    mdiTownHall
} from '@mdi/js';

import {
    Col,
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
    const [clicked, setClicked] = useState<LatLng>(null);
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
            scrollWheelZoom={true}
            style={{height: '100vh', width: '100%'}}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OSM</a>, <a href="https://ilefa.club">ILEFA Labs</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapHandlers entries={entries} setClicked={setClicked} setEntries={setEntries} setModal={setModal} />

            {
                entries.map(ent => (
                    <Marker key={ent.position.lat + ent.position.lng} position={[ent.position.lat, ent.position.lng]} icon={icons[(ent as MarkerProps).type ?? 'other']}>
                        <Popup>
                            A pretty CSS3 popup. <br /> Easily customizable. <br />
                            <span className="text-primary cursor-pointer" onClick={_ => {
                                setModal(ent);
                            }}>edit</span>{" "}
                            <span className="text-danger cursor-pointer" onClick={_ => {
                                setEntries(entries.filter(item => item.position !== ent.position));
                                setClicked(null);
                            }}>remove</span>
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
                            console.log('index=', index, 'marker=', marker);
                            setEntries(entries);
                            console.log(entries);
                        }}
                        marker={modal}
                    />
            }
        </MapContainer>
    )
}

interface MapHandlersProps {
    entries: (MarkerProps | PartialMarkerProps)[];
    setClicked: Dispatch<LatLng>;
    setEntries: Dispatch<SetStateAction<(MarkerProps | PartialMarkerProps)[]>>;
    setModal: Dispatch<SetStateAction<MarkerProps | PartialMarkerProps>>;
}

// only used for initial marker creation, since edit button exists on marker popup
const MapHandlers: React.FC<MapHandlersProps> = ({ entries, setClicked, setEntries, setModal }) => {
    const map = useMapEvent('click', e => {
        setEntries(entries
            ? [...entries, { position: e.latlng }]
            : [{ position: e.latlng }]);

        setClicked(e.latlng);
        setModal({ position: e.latlng });
    });

    return <></>;
}

interface MarkerEditorModalProps {
    open: boolean;
    setOpen: (state: boolean) => void;
    commit: (marker: MarkerProps) => void;
    marker: MarkerProps | PartialMarkerProps;
}

function or<T>(x: (MarkerProps | PartialMarkerProps) | null, field: keyof MarkerProps, orElse = null): T | null {
    return x && x[field]
        ? x[field] as T
        : orElse;
}

const MarkerEditorModal: React.FC<MarkerEditorModalProps> = ({ open, setOpen, commit, marker }) => {
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

    const title = (
        <span>
            <span className="text-primary-light">{store.name ?? 'Unknown Marker'}</span>
            {" "} at {" "}
            <code className="text-green">{store.position.lat}, {store.position.lng}</code>
        </span>
    );

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
            title={title}>
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
                                    <Input placeholder="Marker Name" type="text" value={store.name} onChange={e => update<string>('name', e.target.value)} />
                                </InputGroup>
                            </FormGroup>
                        </Col>
                        <Col md="4">
                            <FormGroup>
                                <InputGroup className="mb-4">
                                    <InputGroupAddon addonType="prepend">
                                        <InputGroupText>
                                            <MdiIcon path={mdiMapMarker} size="20px" />
                                        </InputGroupText>
                                    </InputGroupAddon>
                                    <Input placeholder="Address" type="text" value={store.address} onChange={e => update<string>('address', e.target.value)} />
                                </InputGroup>
                            </FormGroup>
                        </Col>
                        <Col md="4">
                            <UncontrolledDropdown className="dropdown-width">
                                <DropdownToggle caret color="white" className="text-capitalize text-left shadow-none dropdown-button dropdown-width dropdown-placeholder">
                                    <MdiIcon path={mdiTimerSand} size="20px" className="fa-fw vaSub mr-2" /> Building Hours
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
                    </Row>
                    <Row>
                        <Col md="12">
                            <Input
                                className="form-control mb-4"
                                placeholder="Marker Description"
                                rows="3"
                                type="textarea"
                                value={store.description}
                                onChange={e => update<string>('description', e.target.value)}
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
                <pre className="text-primary">
                    {JSON.stringify(marker, null, 3)}
                </pre>
        </Modal>
    );
}

export default Map;
