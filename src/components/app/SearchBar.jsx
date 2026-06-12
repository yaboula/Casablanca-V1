import { format } from "date-fns";
import { MapPin, Calendar as CalendarIcon, Clock, ChevronDown } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useStore } from "@/context/AppStore";

const Cell = ({ icon: Icon, label, value, sub, testid, last }) => (
    <button
        type="button"
        data-testid={testid}
        className={`group w-full text-left px-5 lg:px-6 py-4 lg:py-5 hover:bg-neutral-50 transition-colors rounded-2xl md:rounded-none ${
            last ? "" : "md:border-r md:border-neutral-200"
        }`}
    >
        <div className="flex items-center gap-2 nx-label font-semibold text-neutral-500">
            <Icon className="w-4 h-4 text-[#1E41FC]" />
            {label}
        </div>
        <div className="mt-2 flex items-center gap-2">
            <span className="text-[1.15rem] font-display font-medium text-neutral-900 leading-none">
                {value}
            </span>
            <ChevronDown className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600" />
        </div>
        {sub && <div className="mt-1.5 nx-meta text-neutral-500">{sub}</div>}
    </button>
);

export const SearchBar = ({ className = "" }) => {
    const { search, setSearch, locations } = useStore();
    const location = locations.find((l) => l.code === search.locationCode) || locations[0];
    const pickup = search.pickupDate ? new Date(search.pickupDate) : undefined;
    const ret = search.returnDate ? new Date(search.returnDate) : undefined;

    return (
        <div
            className={`bg-white border border-neutral-200 rounded-[1.25rem] grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-neutral-200 p-2 md:p-0 ${className}`}
            data-testid="search-bar"
        >
            <Popover>
                <PopoverTrigger asChild>
                    <div>
                        <Cell
                            icon={MapPin}
                            label="Pickup location"
                            value={location.primary}
                            sub={location.secondary}
                            testid="search-location"
                        />
                    </div>
                </PopoverTrigger>
                <PopoverContent align="start" sideOffset={8} className="w-[320px] p-2 rounded-2xl border-neutral-200 shadow-xl">
                    {locations.map((loc) => (
                        <button
                            key={loc.code + loc.secondary}
                            onClick={() => setSearch({ locationCode: loc.code })}
                            className={`w-full text-left px-3.5 py-3 rounded-xl text-sm flex items-center justify-between transition-colors ${
                                loc.code === location.code ? "bg-neutral-100" : "hover:bg-neutral-50"
                            }`}
                        >
                            <span>
                                <span className="font-medium text-neutral-900">{loc.primary}</span>
                                <span className="block text-xs text-neutral-500 mt-0.5">{loc.secondary}</span>
                            </span>
                            <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-500">{loc.code}</span>
                        </button>
                    ))}
                </PopoverContent>
            </Popover>

            <Popover>
                <PopoverTrigger asChild>
                    <div>
                        <Cell
                            icon={CalendarIcon}
                            label="Pickup"
                            value={pickup ? format(pickup, "EEE, MMM d") : "Add date"}
                            sub={pickup ? format(pickup, "yyyy") : "Choose a day"}
                            testid="search-pickup"
                        />
                    </div>
                </PopoverTrigger>
                <PopoverContent align="start" sideOffset={8} className="p-0 rounded-2xl border-neutral-200 shadow-xl">
                    <Calendar
                        mode="single"
                        selected={pickup}
                        onSelect={(d) => setSearch({ pickupDate: d ? d.toISOString() : null })}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            <Popover>
                <PopoverTrigger asChild>
                    <div>
                        <Cell
                            icon={Clock}
                            label="Return"
                            value={ret ? format(ret, "EEE, MMM d") : "Add date"}
                            sub={ret ? format(ret, "yyyy") : "Choose a day"}
                            testid="search-return"
                            last
                        />
                    </div>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={8} className="p-0 rounded-2xl border-neutral-200 shadow-xl">
                    <Calendar
                        mode="single"
                        selected={ret}
                        onSelect={(d) => setSearch({ returnDate: d ? d.toISOString() : null })}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default SearchBar;
