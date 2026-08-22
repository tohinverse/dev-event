import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { BASE_URL } from "@/lib/config"
import type { EventItem } from "@/lib/constants"

const getEvents = async (): Promise<EventItem[]> => {
	const res = await fetch(`${BASE_URL}/api/events`, { cache: "no-store" });

	if (!res.ok) {
		return [];
	}

	const { events } = await res.json();

	return events;
}

const Page = async () => {
	const events = await getEvents();

	return (
		<section>
			<h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
			<p className="text-center mt-5">
				Hackathons, Meetups and Conferences. All in One Place.
			</p>
			<ExploreBtn />
			<div className="mt-20 space-y-7">
                <h3>Featured Events</h3>

				<ul className="events">
					{events && events.length > 0 && events.map((event) => (
                        <li key={event.slug} className="list-none">
                            <EventCard {...event} />
                        </li>
                    ))}
				</ul>
            </div>
		</section>
	)
}

export default Page
